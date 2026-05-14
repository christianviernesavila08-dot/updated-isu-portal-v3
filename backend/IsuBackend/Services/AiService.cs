using IsuBackend.Models;

namespace IsuBackend.Services;

public class AiService
{
    private readonly string _geminiApiKey;

    public AiService(IConfiguration configuration)
    {
        _geminiApiKey = configuration["GEMINI_API_KEY"] ?? string.Empty;
    }

    public bool IsEnabled => !string.IsNullOrWhiteSpace(_geminiApiKey);

    public Task<string> GenerateManagementSummaryAsync(List<EvaluationRecord> records)
    {
        if (!IsEnabled)
        {
            return Task.FromResult("Gemini API key is not configured on the backend.");
        }

        // TODO: Implement actual Gemini API call.
        return Task.FromResult("AI summary generation is not yet implemented on the backend.");
    }
}
