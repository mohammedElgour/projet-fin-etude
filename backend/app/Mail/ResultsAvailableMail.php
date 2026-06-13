<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResultsAvailableMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $stagiaireName,
        public float $average
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Résultats disponibles',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.results-available',
            with: [
                'stagiaireName' => $this->stagiaireName,
                'average' => $this->average,
            ],
        );
    }
}
