const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const isAuthenticated = require('../middleware/auth');
const Trek = require('../models/Trek');
const Payment = require('../models/Payment');

// Create a checkout session
router.post('/create-checkout-session', isAuthenticated, async (req, res) => {
  try {
    const { trekId, quantity = 1 } = req.body;
    
    if (!trekId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Trek ID is required' 
      });
    }

    // Get trek details from database
    const trek = await Trek.findById(trekId);
    if (!trek) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trek not found' 
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: trek.name,
              description: `${trek.duration} days trek in ${trek.location}`,
              images: [trek.imageUrl],
            },
            unit_amount: Math.round(trek.price * 100), // Convert to pence/cents
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/trek/${trekId}`,
      metadata: {
        userId: req.user.id,
        trekId: trekId,
        quantity: quantity
      }
    });

    // Return the session ID to the client
    res.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Payment session creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating payment session',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Webhook to handle successful payments
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Create a record of the payment
    try {
      await Payment.create({
        userId: session.metadata.userId,
        trekId: session.metadata.trekId,
        stripeSessionId: session.id,
        amount: session.amount_total / 100, // Convert from pence/cents
        status: 'completed',
        quantity: session.metadata.quantity
      });
      
      console.log('Payment recorded successfully');
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  }

  // Return a response to acknowledge receipt of the event
  res.json({received: true});
});

// Get payment history for current user
router.get('/history', isAuthenticated, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate('trekId', 'name location duration imageUrl')
      .sort('-createdAt');
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// Verify payment status
router.get('/verify/:sessionId', isAuthenticated, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Check if payment exists in our database
    const payment = await Payment.findOne({ 
      stripeSessionId: sessionId,
      userId: req.user.id
    }).populate('trekId');
    
    if (payment) {
      return res.json({
        success: true,
        verified: true,
        payment
      });
    }
    
    // If not found in DB, check with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      // Create payment record if not exists
      const newPayment = await Payment.create({
        userId: req.user.id,
        trekId: session.metadata.trekId,
        stripeSessionId: sessionId,
        amount: session.amount_total / 100,
        status: 'completed',
        quantity: session.metadata.quantity
      });
      
      await newPayment.populate('trekId');
      
      return res.json({
        success: true,
        verified: true,
        payment: newPayment
      });
    }
    
    res.json({
      success: true,
      verified: false,
      session
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});
console.log("Loaded routes/payments.js");
module.exports = router;