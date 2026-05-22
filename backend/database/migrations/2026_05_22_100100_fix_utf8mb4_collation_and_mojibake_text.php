<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->applyUtf8Collation();
        $this->normalizeStoredLabels();
    }

    public function down(): void
    {
    }

    private function applyUtf8Collation(): void
    {
        $driver = DB::getDriverName();

        if (!in_array($driver, ['mysql', 'mariadb'], true)) {
            return;
        }

        $database = DB::getDatabaseName();

        if ($database) {
            DB::statement("ALTER DATABASE `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        }

        foreach ([
            'users',
            'filiers',
            'groupes',
            'modules',
            'professeurs',
            'stagiaires',
            'notes',
            'note_submissions',
            'notifications',
        ] as $table) {
            if (Schema::hasTable($table)) {
                DB::statement("ALTER TABLE `{$table}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            }
        }
    }

    private function normalizeStoredLabels(): void
    {
        $filiereMap = [
            'DÃ©veloppement Digital' => 'Développement Digital',
            'DÃƒÂ©veloppement Digital' => 'Développement Digital',
            'GÃ©nie Electrique' => 'Génie Electrique',
            'GÃƒÂ©nie Electrique' => 'Génie Electrique',
            'GÃ©nie Civil' => 'Génie Civil',
            'GÃƒÂ©nie civil' => 'Génie Civil',
        ];

        foreach ($filiereMap as $badValue => $goodValue) {
            DB::table('filiers')
                ->where('nom', $badValue)
                ->update([
                    'nom' => $goodValue,
                    'updated_at' => now(),
                ]);
        }

        $moduleMap = [
            'Se situer au regard du mÃ©tier et de la dÃ©marche de formation' => 'Se situer au regard du métier et de la démarche de formation',
            'AcquÃ©rir les bases de lâ€™algorithmique' => 'Acquérir les bases de l’algorithmique',
            'Programmer en OrientÃ© Objet' => 'Programmer en Orienté Objet',
            'DÃ©velopper des sites web statiques' => 'Développer des sites web statiques',
            'Manipuler des bases de donnÃ©es' => 'Manipuler des bases de données',
            'DÃ©velopper des sites web dynamiques' => 'Développer des sites web dynamiques',
            'Sâ€™initier Ã  la sÃ©curitÃ© des systÃ¨mes dâ€™information' => 'S’initier à la sécurité des systèmes d’information',
            'Comprendre les enjeux dâ€™un systÃ¨me dâ€™information' => 'Comprendre les enjeux d’un système d’information',
            'Concevoir un rÃ©seau informatique' => 'Concevoir un réseau informatique',
            'Fonctionnement du systÃ¨me dâ€™exploitation' => 'Fonctionnement du système d’exploitation',
            'GÃ©rer une infrastructure virtualisÃ©e' => 'Gérer une infrastructure virtualisée',
            'Automatiser les tÃ¢ches dâ€™administration' => 'Automatiser les tâches d’administration',
            'SÃ©curiser un systÃ¨me dâ€™information' => 'Sécuriser un système d’information',
            'DÃ©velopper une veille technologique' => 'Développer une veille technologique',
        ];

        foreach ($moduleMap as $badValue => $goodValue) {
            DB::table('modules')
                ->where('nom', $badValue)
                ->update([
                    'nom' => $goodValue,
                    'updated_at' => now(),
                ]);
        }
    }
};
