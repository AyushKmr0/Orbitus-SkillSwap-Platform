class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;

    // Flatten data keys to root for seamless client compatibility (e.g. res.data.user & res.data.data.user)
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      Object.assign(this, data);
    }
  }
}

export { ApiResponse };
