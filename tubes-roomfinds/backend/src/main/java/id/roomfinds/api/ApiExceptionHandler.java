package id.roomfinds.api;

import java.util.Map;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class) ResponseEntity<Map<String,String>> badRequest(IllegalArgumentException e) { return ResponseEntity.badRequest().body(Map.of("message", e.getMessage())); }
    @ExceptionHandler(DuplicateKeyException.class) ResponseEntity<Map<String,String>> duplicate(DuplicateKeyException e) { return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Email atau data tersebut sudah terdaftar.")); }
    @ExceptionHandler(ResponseStatusException.class) ResponseEntity<Map<String,String>> status(ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason()==null?"Request tidak dapat diproses.":e.getReason())); }
    @ExceptionHandler(EmptyResultDataAccessException.class) ResponseEntity<Map<String,String>> notFound(EmptyResultDataAccessException e) { return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Data yang diminta tidak ditemukan.")); }
    @ExceptionHandler(Exception.class) ResponseEntity<Map<String,String>> unknown(Exception e) { return ResponseEntity.status(500).body(Map.of("message", "Terjadi kesalahan pada server. Silakan coba lagi.")); }
}
