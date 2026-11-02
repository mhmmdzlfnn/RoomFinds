package id.roomfinds.api;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import java.io.IOException;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class RoomFindsApplication {
    public static void main(String[] args) { SpringApplication.run(RoomFindsApplication.class, args); }
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    @Bean Jackson2ObjectMapperBuilderCustomizer postgresJsonCustomizer() {
        var module = new SimpleModule();
        try {
            @SuppressWarnings("unchecked") Class<Object> pgObjectType = (Class<Object>) Class.forName("org.postgresql.util.PGobject");
            module.addSerializer(pgObjectType, new JsonSerializer<>() {
            @Override public void serialize(Object value, JsonGenerator generator, SerializerProvider serializers) throws IOException {
                try { generator.writeRawValue((String) value.getClass().getMethod("getValue").invoke(value)); }
                catch (ReflectiveOperationException e) { throw new IOException("Tidak dapat membaca nilai JSONB PostgreSQL.", e); }
            }
            });
        } catch (ClassNotFoundException e) { throw new IllegalStateException("PostgreSQL JDBC driver tidak tersedia.", e); }
        return builder -> builder.modulesToInstall(module);
    }
    @Bean WebMvcConfigurer corsConfigurer(org.springframework.core.env.Environment env) {
        return new WebMvcConfigurer() { @Override public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/api/**").allowedOrigins(env.getProperty("roomfinds.cors-origin", "http://localhost:3000"))
                .allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS").allowCredentials(true).allowedHeaders("*");
        }};
    }
}
