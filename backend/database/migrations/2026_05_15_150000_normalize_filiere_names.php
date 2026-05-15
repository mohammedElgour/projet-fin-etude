<?php

use App\Support\FiliereNameNormalizer;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $filieres = DB::table('filiers')
            ->orderBy('id')
            ->get();

        $canonicalIds = [];

        foreach ($filieres as $filiere) {
            $canonicalName = FiliereNameNormalizer::canonicalize($filiere->nom);
            $key = FiliereNameNormalizer::key($canonicalName);

            if (!isset($canonicalIds[$key])) {
                DB::table('filiers')
                    ->where('id', $filiere->id)
                    ->update([
                        'nom' => $canonicalName,
                        'updated_at' => now(),
                    ]);

                $canonicalIds[$key] = $filiere->id;
                continue;
            }

            $targetId = $canonicalIds[$key];

            DB::table('groupes')
                ->where('filiere_id', $filiere->id)
                ->update(['filiere_id' => $targetId]);

            DB::table('modules')
                ->where('filiere_id', $filiere->id)
                ->update(['filiere_id' => $targetId]);

            if (DB::getSchemaBuilder()->hasColumn('professeurs', 'filiere_id')) {
                DB::table('professeurs')
                    ->where('filiere_id', $filiere->id)
                    ->update(['filiere_id' => $targetId]);
            }

            DB::table('filiers')
                ->where('id', $filiere->id)
                ->delete();
        }
    }

    public function down(): void
    {
    }
};
