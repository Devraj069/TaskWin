// Postback handler for affiliate networks
// This would typically be deployed as a serverless function (Vercel, Netlify Functions, etc.)

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

exports.handleAffiliatePostback = functions.https.onRequest(async (req, res) => {
    try {
        // Enable CORS for development
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        console.log('Postback received:', req.query);

        // Extract postback parameters
        const { 
            sub_id: userId, 
            status, 
            reward, 
            offer_id, 
            payout,
            click_id,
            conversion_id,
            ip,
            user_agent 
        } = req.query;

        // Validate required parameters
        if (!userId || !status) {
            console.error('Missing required parameters:', { userId, status });
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required parameters: sub_id and status' 
            });
        }

        // Log the postback for debugging
        await db.collection('postbackLogs').add({
            userId,
            status,
            reward: reward ? parseFloat(reward) : null,
            offerId: offer_id,
            payout: payout ? parseFloat(payout) : null,
            clickId: click_id,
            conversionId: conversion_id,
            ip,
            userAgent: user_agent,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            processed: false
        });

        // Process the postback
        const result = await processAffiliatePostback({
            userId,
            status,
            reward: reward ? parseFloat(reward) : null,
            offerId: offer_id,
            payout: payout ? parseFloat(payout) : null,
            clickId: click_id,
            conversionId: conversion_id
        });

        if (result.success) {
            res.status(200).json({ 
                success: true, 
                message: 'Postback processed successfully',
                userId,
                status,
                coinsAwarded: result.coinsAwarded
            });
        } else {
            res.status(400).json({ 
                success: false, 
                error: result.error 
            });
        }

    } catch (error) {
        console.error('Postback processing error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

async function processAffiliatePostback(postbackData) {
    const { userId, status, reward, offerId, clickId, conversionId } = postbackData;

    try {
        // Find the user's affiliate task record
        const userTasksSnapshot = await db.collection('userTasks')
            .where('userId', '==', userId)
            .where('status', '==', 'pending')
            .get();

        if (userTasksSnapshot.empty) {
            console.log('No pending tasks found for user:', userId);
            return { success: false, error: 'No pending tasks found for user' };
        }

        let taskUpdated = false;
        let coinsAwarded = 0;

        for (const taskDoc of userTasksSnapshot.docs) {
            const taskData = taskDoc.data();
            
            if (status === 'approved' || status === 'completed') {
                // Update task status to completed
                await taskDoc.ref.update({
                    status: 'completed',
                    completedAt: admin.firestore.FieldValue.serverTimestamp(),
                    actualReward: reward || taskData.rewardCoins,
                    conversionId,
                    clickId,
                    postbackProcessedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // Credit coins to user
                const coinsToCredit = reward || taskData.rewardCoins;
                await creditCoinsToUser(userId, coinsToCredit);
                
                // Log activity
                await logUserActivity(userId, 'affiliate_completed', {
                    campaignId: taskData.campaignId,
                    reward: coinsToCredit,
                    offerId,
                    conversionId,
                    clickId
                });

                coinsAwarded += coinsToCredit;
                taskUpdated = true;
                
                console.log(`Approved task for user ${userId}, awarded ${coinsToCredit} coins`);
                
            } else if (status === 'rejected' || status === 'declined') {
                // Update task status to rejected
                await taskDoc.ref.update({
                    status: 'rejected',
                    rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
                    rejectionReason: postbackData.reason || 'Offer requirements not met',
                    conversionId,
                    clickId,
                    postbackProcessedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // Log activity
                await logUserActivity(userId, 'affiliate_rejected', {
                    campaignId: taskData.campaignId,
                    offerId,
                    reason: postbackData.reason || 'Requirements not met',
                    conversionId,
                    clickId
                });

                taskUpdated = true;
                
                console.log(`Rejected task for user ${userId}`);
            }
        }

        return { 
            success: taskUpdated, 
            userId, 
            status,
            coinsAwarded 
        };

    } catch (error) {
        console.error('Error processing postback:', error);
        return { success: false, error: error.message };
    }
}

async function creditCoinsToUser(userId, amount) {
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const newCoinBalance = (userData.coins || 0) + amount;
            
            await userRef.update({
                coins: newCoinBalance,
                lastActive: new Date().toISOString(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`Credited ${amount} coins to user ${userId}. New balance: ${newCoinBalance}`);
            return newCoinBalance;
        } else {
            throw new Error(`User ${userId} not found`);
        }
    } catch (error) {
        console.error('Error crediting coins:', error);
        throw error;
    }
}

async function logUserActivity(userId, type, details) {
    try {
        await db.collection('activities').add({
            userId,
            type,
            details,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString()
        });
        
        console.log(`Logged activity: ${type} for user ${userId}`);
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error here as it's not critical
    }
}

// Alternative endpoint for testing postbacks locally
exports.testPostback = functions.https.onRequest(async (req, res) => {
    // This is for testing purposes only
    const testPostback = {
        sub_id: 'test-user-id',
        status: 'approved',
        reward: '150',
        offer_id: 'test-offer-123',
        conversion_id: 'conv-456'
    };

    const result = await processAffiliatePostback({
        userId: testPostback.sub_id,
        status: testPostback.status,
        reward: parseFloat(testPostback.reward),
        offerId: testPostback.offer_id,
        conversionId: testPostback.conversion_id
    });

    res.json({
        test: true,
        postback: testPostback,
        result
    });
});

module.exports = { processAffiliatePostback, creditCoinsToUser, logUserActivity };