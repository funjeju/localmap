export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public userMessage: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const errorMessages: Record<string, { userMessage: string; statusCode: number }> = {
  // Auth errors
  'auth/user-not-found': { userMessage: '사용자를 찾을 수 없습니다.', statusCode: 404 },
  'auth/wrong-password': { userMessage: '비밀번호가 올바르지 않습니다.', statusCode: 401 },
  'auth/email-already-in-use': { userMessage: '이미 사용 중인 이메일입니다.', statusCode: 400 },
  'auth/weak-password': { userMessage: '비밀번호가 너무 약합니다. 최소 6자 이상이어야 합니다.', statusCode: 400 },
  'auth/invalid-email': { userMessage: '올바른 이메일 형식이 아닙니다.', statusCode: 400 },
  'auth/operation-not-allowed': { userMessage: '이 작업은 현재 허용되지 않습니다.', statusCode: 403 },
  'auth/too-many-requests': { userMessage: '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.', statusCode: 429 },

  // Tenant errors
  'tenant/not-found': { userMessage: '학교를 찾을 수 없습니다.', statusCode: 404 },
  'tenant/access-denied': { userMessage: '이 학교에 접근할 권한이 없습니다.', statusCode: 403 },
  'tenant/invalid-invite-code': { userMessage: '유효하지 않거나 만료된 초대 코드입니다.', statusCode: 400 },
  'tenant/invite-code-expired': { userMessage: '초대 코드가 만료되었습니다.', statusCode: 400 },
  'tenant/invite-code-used': { userMessage: '이미 사용된 초대 코드입니다.', statusCode: 400 },
  'tenant/creation-failed': { userMessage: '학교 등록에 실패했습니다. 다시 시도해주세요.', statusCode: 500 },

  // Pin errors
  'pin/not-found': { userMessage: '위치(핀)를 찾을 수 없습니다.', statusCode: 404 },
  'pin/creation-failed': { userMessage: '위치 추가에 실패했습니다.', statusCode: 500 },
  'pin/update-failed': { userMessage: '위치 수정에 실패했습니다.', statusCode: 500 },
  'pin/delete-failed': { userMessage: '위치 삭제에 실패했습니다.', statusCode: 500 },
  'pin/access-denied': { userMessage: '이 위치를 수정할 권한이 없습니다.', statusCode: 403 },
  'pin/delete-denied': { userMessage: '이 위치를 삭제할 권한이 없습니다.', statusCode: 403 },

  // Image errors
  'image/upload-failed': { userMessage: '사진 업로드에 실패했습니다.', statusCode: 500 },
  'image/delete-failed': { userMessage: '사진 삭제에 실패했습니다.', statusCode: 500 },
  'image/invalid-format': { userMessage: '지원되지 않는 사진 형식입니다.', statusCode: 400 },
  'image/too-large': { userMessage: '사진 크기가 너무 큽니다. 10MB 이하여야 합니다.', statusCode: 400 },

  // General errors
  'network/offline': { userMessage: '네트워크 연결을 확인해주세요.', statusCode: 0 },
  'network/timeout': { userMessage: '요청이 시간 초과되었습니다. 다시 시도해주세요.', statusCode: 408 },
  'validation/invalid-input': { userMessage: '입력값이 올바르지 않습니다.', statusCode: 400 },
  'geocoding/failed': { userMessage: '주소를 찾을 수 없습니다. 다시 입력해주세요.', statusCode: 400 },
  'permission/denied': { userMessage: '이 작업을 수행할 권한이 없습니다.', statusCode: 403 },
  'server/error': { userMessage: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', statusCode: 500 },
};

export function getErrorMessage(error: any): { userMessage: string; statusCode: number } {
  // Handle Firebase Auth errors
  if (error?.code) {
    if (error.code in errorMessages) {
      return errorMessages[error.code];
    }
  }

  // Handle network errors
  if (error?.message?.includes('network')) {
    return errorMessages['network/offline'];
  }

  // Handle timeout errors
  if (error?.message?.includes('timeout') || error?.message?.includes('408')) {
    return errorMessages['network/timeout'];
  }

  // Handle JSON responses with error code
  if (error?.statusCode && error?.code && error.code in errorMessages) {
    return errorMessages[error.code];
  }

  // Default error
  return errorMessages['server/error'];
}

export function createErrorResponse(error: any) {
  const { userMessage, statusCode } = getErrorMessage(error);
  return {
    error: error?.code || 'unknown_error',
    message: userMessage,
    statusCode,
  };
}

export async function handleFirebaseError(error: any): Promise<never> {
  const { userMessage, statusCode } = getErrorMessage(error);
  throw new AppError(error?.code || 'unknown', error?.message || 'Unknown error', userMessage, statusCode);
}
