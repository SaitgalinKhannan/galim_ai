// Вспомогательная функция для проверки типа ошибки
export function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && "code" in error;
}