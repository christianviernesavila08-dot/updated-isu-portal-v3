using IsuBackend.DTOs;
using IsuBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace IsuBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AiController : ControllerBase
{
    private readonly AiService _aiService;

    public AiController(AiService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("summary")]
    public async Task<IActionResult> GetSummary([FromBody] UserStatsResponse stats)
    {
        var summary = await _aiService.GenerateManagementSummaryAsync(stats.RecentRecords);
        return Ok(new EvaluationSummaryResponse { Summary = summary });
    }
}
