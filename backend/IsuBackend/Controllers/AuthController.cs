using BCrypt.Net;
using IsuBackend.DTOs;
using IsuBackend.Models;
using IsuBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace IsuBackend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IFirestoreOperations _firestore;

    public AuthController(IFirestoreOperations firestore)
    {
        _firestore = firestore;
    }

    [HttpPost("signup")]
    public async Task<IActionResult> Signup([FromBody] SignupRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Username and password are required.");
        }

        var existingUser = await _firestore.GetUserByUsernameAsync(request.Username);
        if (existingUser is not null)
        {
            return Conflict("Username already taken.");
        }

        var user = new User
        {
            Username = request.Username.Trim().ToLowerInvariant(),
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? request.Username.Trim() : request.DisplayName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        await _firestore.CreateUserAsync(user);

        return Ok(new AuthResponse
        {
            Id = user.Id,
            Username = user.Username,
            DisplayName = user.DisplayName
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Username and password are required.");
        }

        var user = await _firestore.GetUserByUsernameAsync(request.Username);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid username or password.");
        }

        return Ok(new AuthResponse
        {
            Id = user.Id,
            Username = user.Username,
            DisplayName = user.DisplayName
        });
    }
}
