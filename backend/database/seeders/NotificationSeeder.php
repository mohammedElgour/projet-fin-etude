<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $messages = [
            'admin@ista.test' => ['Trois notes attendent une validation.'],
            'prof@ista.test' => ['Pensez a finaliser les notes du groupe DD101.'],
            'sara@ista.test' => ['Vos notes validees sont disponibles sur le portail.'],
        ];

        foreach ($messages as $email => $userMessages) {
            $user = User::where('email', $email)->first();
            if (! $user) {
                continue;
            }

            foreach ($userMessages as $message) {
                Notification::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'message' => $message,
                    ],
                    ['is_read' => false]
                );
            }
        }
    }
}
