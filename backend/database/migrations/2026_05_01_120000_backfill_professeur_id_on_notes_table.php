<?php

use App\Models\EmploiDuTemps;
use App\Models\Note;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Note::query()
            ->whereNull('professeur_id')
            ->with('stagiaire')
            ->chunkById(100, function ($notes): void {
                foreach ($notes as $note) {
                    $groupeId = $note->stagiaire?->groupe_id;

                    if (! $groupeId) {
                        continue;
                    }

                    $professeurId = EmploiDuTemps::query()
                        ->where('groupe_id', $groupeId)
                        ->where('module_id', $note->module_id)
                        ->value('professeur_id');

                    if ($professeurId) {
                        $note->updateQuietly([
                            'professeur_id' => $professeurId,
                        ]);
                    }
                }
            });
    }

    public function down(): void
    {
        Note::query()->update([
            'professeur_id' => null,
        ]);
    }
};
