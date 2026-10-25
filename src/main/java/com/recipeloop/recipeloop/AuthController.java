
package com.recipeloop.recipeloop;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final SecurityContextRepository securityContextRepository;
    private final CsrfTokenRepository csrfTokenRepository;

    public AuthController(
            AuthService authService,
            SecurityContextRepository securityContextRepository,
            CsrfTokenRepository csrfTokenRepository) {
        this.authService = authService;
        this.securityContextRepository = securityContextRepository;
        this.csrfTokenRepository = csrfTokenRepository;
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 8, max = 72) String password) {
    }

    public record LoginRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank String password) {
    }

    public record UserResponse(Long id, String name, String email) {
    }

    @GetMapping("/csrf")
    public ResponseEntity<String> csrf(CsrfToken csrfToken) {
        return ResponseEntity.ok(csrfToken.getToken());
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        try {
            AppUser user = authService.register(
                    request.name(),
                    request.email(),
                    request.password());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(toUserResponse(user));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {
        try {
            AppUser user = authService.authenticate(
                    request.email(),
                    request.password());

            if (servletRequest.getSession(false) != null) {
                servletRequest.changeSessionId();
            }

            UsernamePasswordAuthenticationToken authentication =
                    UsernamePasswordAuthenticationToken.authenticated(
                            user.getEmail(),
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_USER")));

            SecurityContext context =
                    SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            securityContextRepository.saveContext(
                    context, servletRequest, servletResponse);

            csrfTokenRepository.saveToken(
                    null, servletRequest, servletResponse);

            return ResponseEntity.ok(toUserResponse(user));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> currentUser(
            Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Not logged in");
        }

        AppUser user = authService.findByEmail(authentication.getName());
        return ResponseEntity.ok(toUserResponse(user));
    }

    private UserResponse toUserResponse(AppUser user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }
}
