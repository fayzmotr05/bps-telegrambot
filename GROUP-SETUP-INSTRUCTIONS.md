# 📢 Telegram Group Setup Instructions

This guide will help you configure Telegram groups for order and feedback notifications.

## Step 1: Create Telegram Groups

1. **Create Orders Group:**
   - Open Telegram and create a new group
   - Name it something like "BPS Orders" or "BPS Buyurtmalar"
   - Add @fayzmotr and any other admins who should handle orders

2. **Create Feedback Group:**
   - Create another group for feedback/complaints
   - Name it "BPS Feedback" or "BPS Fikrlar"  
   - Add @fayzmotr and customer service team members

## Step 2: Add Bot to Groups

1. **Add bot to Orders Group:**
   - In the orders group, click "Add Member"
   - Search for your bot username (check bot logs for the username)
   - Add the bot to the group
   - Make the bot an admin (optional but recommended)

2. **Add bot to Feedback Group:**
   - Repeat the same process for the feedback group

## Step 3: Get Group Chat IDs

1. **Start your bot** (if not running):
   ```bash
   node src/bot.js
   ```

2. **Send a message in each group:**
   - Go to the Orders group and send any message (like "test")
   - Go to the Feedback group and send any message
   - The bot will automatically log the group chat IDs in the console

3. **Check the logs** for messages like:
   ```
   📢 Group detected: "BPS Orders" - Chat ID: -1001234567890
   📢 Group detected: "BPS Feedback" - Chat ID: -1001234567891
   ```

## Step 4: Update Environment Variables

Add the group chat IDs to your `.env` file:

```env
# Telegram Groups (add these lines)
ORDERS_GROUP_ID=-1001234567890
FEEDBACK_GROUP_ID=-1001234567891
```

**Important:** 
- Use the EXACT chat ID from the logs (including the minus sign)
- Group chat IDs always start with -100

## Step 5: Test the Integration

1. **Restart the bot** to load the new environment variables:
   ```bash
   node src/bot.js
   ```

2. **Check connection status** in the logs:
   ```
   📢 Orders group connected
   📢 Feedback group connected
   ```

3. **Test order notification:**
   - Use the bot to place a test order
   - Check if notification appears in the Orders group with action buttons

4. **Test feedback notification:**
   - Send feedback through the bot
   - Check if notification appears in the Feedback group

## Troubleshooting

**If groups show "not connected":**
- Double-check the chat IDs in .env file
- Make sure the bot is added to the groups
- Restart the bot after updating .env

**If no group chat ID appears in logs:**
- Make sure the bot is running when you send messages
- The bot must be a member of the group
- Try sending another message in the group

**If notifications don't work:**
- Check that ORDERS_GROUP_ID and FEEDBACK_GROUP_ID are set correctly
- Verify the bot has permission to send messages in the groups
- Check the bot logs for any error messages

## Group Features

**Orders Group Notifications Include:**
- Order ID and timestamp
- Customer details (name, phone, username)
- Product information and quantity
- Quick action buttons: ✅ Accept | ❌ Reject
- Direct call button for customer phone

**Feedback Group Notifications Include:**
- Feedback ID and timestamp  
- Customer information
- Full feedback message
- Action buttons: 💬 Respond | ✅ Mark as Read

## Next Steps

Once group integration is working:
1. Train your team on using the group notifications
2. Set up notification settings for important updates
3. Consider adding more admin users to handle orders/feedback

---

**🎉 Group integration complete!** Your team can now efficiently manage orders and feedback directly from Telegram groups.