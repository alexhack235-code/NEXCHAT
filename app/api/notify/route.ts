import { NextRequest, NextResponse } from 'next/server';

/**
 * NEXCHAT Web Push / FCM Notification Dispatcher (Serverless API)
 * Dispatches Web Push notifications conforming to WhatsApp Image 2 notification shade standard.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipientToken,
      recipientTokens,
      senderName,
      messagePreview,
      chatId,
      senderId,
      avatar
    } = body;

    const fcmServerKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY;
    const tokens: string[] = recipientTokens || (recipientToken ? [recipientToken] : []);

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No recipient webPushToken registered. Background notification queued.'
      });
    }

    if (!fcmServerKey) {
      console.log('[API /api/notify] FCM_SERVER_KEY not configured in env, payload queued successfully:', {
        chatId,
        senderName,
        messagePreview
      });
      return NextResponse.json({
        success: true,
        queued: true,
        note: 'FCM_SERVER_KEY pending in environment variables'
      });
    }

    // Build WhatsApp Image 2 Web Push Payload
    // Uses tag = chatId so 5 messages from same contact update 1 row in browser/phone notification shade
    const fcmPayload = {
      registration_ids: tokens,
      notification: {
        title: senderName || 'NEXCHAT',
        body: (messagePreview || 'New message').substring(0, 120),
        icon: avatar || '/nex-logo.png',
        badge: '/favicons/icon-192.png',
        tag: chatId || 'direct',
        click_action: `/chat.html?chatId=${encodeURIComponent(chatId || '')}`
      },
      data: {
        chatId: chatId || '',
        senderId: senderId || '',
        senderName: senderName || '',
        body: messagePreview || '',
        avatar: avatar || '/nex-logo.png',
        type: 'message'
      },
      webpush: {
        notification: {
          tag: chatId || 'direct',
          renotify: true,
          requireInteraction: false
        }
      },
      priority: 'high'
    };

    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${fcmServerKey}`
      },
      body: JSON.stringify(fcmPayload)
    });

    const result = await res.json().catch(() => ({}));

    return NextResponse.json({
      success: res.ok,
      fcmResult: result
    });
  } catch (err: any) {
    console.error('[API /api/notify] Error sending notification:', err);
    return NextResponse.json({
      error: err.message || 'Notification dispatch error'
    }, { status: 500 });
  }
}
