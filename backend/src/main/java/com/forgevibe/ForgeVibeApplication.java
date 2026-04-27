package com.forgevibe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ForgeVibeApplication {
    public static void main(String[] args) {
        SpringApplication.run(ForgeVibeApplication.class, args);
    }
}
