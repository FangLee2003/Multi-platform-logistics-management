package ktc.spring_project.exceptions;

import org.springframework.http.HttpStatus;

public class EntityDuplicateException extends RuntimeException {
    private final HttpStatus status;

    public EntityDuplicateException(String message) {
        super(message);
        this.status = HttpStatus.CONFLICT;
    }

    public HttpStatus getStatus() {
        return status;
    }
}

package ktc.spring_project.exceptions;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class EntityDuplicateException extends RuntimeException {

    private final HttpStatus status;

    public EntityDuplicateException(String entityName) {
        super(entityName + " duplicate in the system");
        this.status = HttpStatus.CONFLICT;
    }
}