
package com.recipeloop.recipeloop;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AppUser register(String name, String email, String password) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException(
                    "Password must contain at least 8 characters");
        }

        String normalizedEmail = email.trim().toLowerCase();
        String normalizedName = name.trim();

        if (appUserRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException(
                    "An account with this email already exists");
        }

        AppUser user = new AppUser(
                normalizedName,
                normalizedEmail,
                passwordEncoder.encode(password)
        );

        return appUserRepository.save(user);
    }

    @Transactional(readOnly = true)
    public AppUser authenticate(String email, String password) {
        if (email == null || email.isBlank()
                || password == null || password.isEmpty()) {
            throw new IllegalArgumentException(
                    "Email and password are required");
        }

        AppUser user = appUserRepository
                .findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException(
                    "Invalid email or password");
        }

        return user;
    }

    @Transactional(readOnly = true)
    public AppUser findByEmail(String email) {
        return appUserRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new IllegalArgumentException(
                        "User account not found"));
    }

}