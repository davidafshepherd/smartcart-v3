import { ApiError } from './apiError';


/**
 * Wraps a fetch call to handle network errors and convert them to ApiError.
 * @typeParam T - The expected type of the response data.
 * @param fetchPromise - The fetch promise to wrap.
 * @returns A promise resolving to the parsed response data.
 * @throws {ApiError} If the request fails (network error or HTTP error).
 */
export async function handleApiCall<T>(fetchPromise: Promise<Response>): Promise<T> {
  try {
    // Await the request and process the response.
    const response = await fetchPromise;
    return handleResponse<T>(response);

  } catch (error) {
    // Handle network errors (fetch fails, CORS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        'Unable to reach the server. Please check your connection.', 
        0, 
        { networkError: true, originalError: error.message },
      );
    }

    // Re-throw ApiError as is.
    if (error instanceof ApiError) throw error;

    // Handle other unexpected errors.
    throw new ApiError('An unexpected error occurred', 0, { originalError: error });
  }
}


/**
 * Handles API response and extracts JSON data or throws an error.
 * @typeParam T - The expected type of the response data.
 * @param response - The fetch Response object to process.
 * @returns A promise resolving to the parsed response data.
 * @throws {ApiError} If the response indicates an error (non-2xx status).
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // Throw an ApiError for non-successful responses.
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail?.message || errorData.detail || 'Request failed', 
      response.status, 
      errorData,
    );
  }
  
  // Handle 204 No Content responses.
  if (response.status === 204) return undefined as T;
  
  // Return the JSON response body.
  return response.json();
}
