<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\JsonResponse;

/**
 * The API's JSON error bodies: { success: false, message, errors? }.
 */
trait RespondsWithErrors
{
    protected function forbidden(string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 403);
    }

    /**
     * @param  array<string, string[]>  $errors  field => messages; omitted from the body when empty
     */
    protected function unprocessable(string $message, array $errors = []): JsonResponse
    {
        return response()->json(array_filter([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], fn ($value) => $value !== []), 422);
    }
}
