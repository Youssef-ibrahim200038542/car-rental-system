<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Symfony\Component\Process\Process;
use Throwable;

class MLRecommendationController extends Controller
{
    public function recommend(Request $request)
    {
        $validated = $request->validate([
            'budget' => ['required', 'numeric', 'min:0'],
            'category' => ['nullable', 'string', 'max:50'],
            'fuel_type' => ['nullable', 'string', 'max:50'],
            'transmission' => ['nullable', 'string', 'max:50'],
            'city' => ['nullable', 'string', 'max:100'],
            'min_year' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'features' => ['nullable'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $projectRoot = dirname(base_path());

        $scriptPath = $projectRoot
            . DIRECTORY_SEPARATOR . 'ML'
            . DIRECTORY_SEPARATOR . 'recommendation_system'
            . DIRECTORY_SEPARATOR . 'recommend.py';

        if (!is_file($scriptPath)) {
            return response()->json([
                'success' => false,
                'message' => 'The Python recommendation script was not found.',
            ], 500);
        }

        try {
            $pythonBinary = env('PYTHON_BINARY', 'python');

            $process = new Process([
                $pythonBinary,
                $scriptPath,
                '--json',
            ]);

            $process->setInput(json_encode(
                $validated,
                JSON_THROW_ON_ERROR
            ));

            $process->setTimeout(30);
            $process->run();

            $output = trim($process->getOutput());

            if (!$process->isSuccessful()) {
                report(new \RuntimeException(
                    'Python recommender failed: ' . $process->getErrorOutput()
                ));

                return response()->json([
                    'success' => false,
                    'message' => 'The recommendation service could not process your request.',
                ], 500);
            }

            $result = json_decode($output, true);

            if (!is_array($result)) {
                report(new \RuntimeException(
                    'Python recommender returned invalid JSON.'
                ));

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid response from the recommendation service.',
                ], 500);
            }

            return response()->json($result);

        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Unable to generate recommendations right now.',
            ], 500);
        }
    }
}