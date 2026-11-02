<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-3.6-flash'),
    ],

    // Share of recommendation requests whose top results get one adjacent pair swapped, so the
    // impression/click logs are not purely position-biased (needed to learn weights from them
    // later). Tests run with 0 so rankings stay deterministic.
    'recommendations' => [
        'explore_rate' => (float) env('RECOMMENDATION_EXPLORE_RATE', env('APP_ENV') === 'testing' ? 0 : 0.1),
    ],

    // Python AI recommender (ML/service/app.py). Empty URL = AI ranking off, rule-based scoring only.
    // Tests run with it off so they never depend on a running Python process.
    'ai_recommender' => [
        'url' => env('AI_RECOMMENDER_URL', env('APP_ENV') === 'testing' ? '' : 'http://127.0.0.1:8001'),
        'timeout' => (float) env('AI_RECOMMENDER_TIMEOUT', 3),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
