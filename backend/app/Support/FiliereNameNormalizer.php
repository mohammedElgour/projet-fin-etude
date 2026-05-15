<?php

namespace App\Support;

class FiliereNameNormalizer
{
    private const CANONICAL_NAMES = [
        "D\u{00E9}veloppement Digital" => [
            "D\u{00E9}veloppement Digital",
            'Developpement Digital',
            'DÃ©veloppement Digital',
            'DÃƒÂ©veloppement Digital',
        ],
        'Infrastructure Digitale' => [
            'Infrastructure Digitale',
            'Infrastructure',
        ],
        'Gestion des Entreprises' => [
            'Gestion des Entreprises',
            'Gestion des entreprise',
        ],
        "G\u{00E9}nie Electrique" => [
            "G\u{00E9}nie Electrique",
            'GÃ©nie Electrique',
            'GÃƒÂ©nie Electrique',
        ],
        "G\u{00E9}nie Civil" => [
            "G\u{00E9}nie Civil",
            'GÃ©nie Civil',
            'GÃƒÂ©nie civil',
        ],
    ];

    public static function canonicalize(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $cleaned = self::clean($value);
        $lookup = mb_strtolower($cleaned);

        foreach (self::CANONICAL_NAMES as $canonical => $aliases) {
            foreach ($aliases as $alias) {
                if ($lookup === mb_strtolower(self::clean($alias))) {
                    return $canonical;
                }
            }
        }

        return $cleaned;
    }

    public static function key(?string $value): string
    {
        return mb_strtolower((string) self::canonicalize($value));
    }

    private static function clean(string $value): string
    {
        return trim((string) preg_replace('/\s+/u', ' ', $value));
    }
}
