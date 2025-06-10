module.exports = {
  generateRandomEmail,
  generateRandomPassword,
  logRequest,
  measureResponseTime
};

function generateRandomEmail(context, events, done) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'cliniclink.com'];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];
  const randomUser = 'user' + Math.floor(Math.random() * 10000);
  
  context.vars.randomEmail = `${randomUser}@${randomDomain}`;
  return done();
}

function generateRandomPassword(context, events, done) {
  const passwords = ['password123', 'test1234', 'cliniclink2024', 'secure123'];
  context.vars.randomPassword = passwords[Math.floor(Math.random() * passwords.length)];
  return done();
}

function logRequest(requestParams, response, context, ee, next) {
  console.log(`Request to ${requestParams.url} - Status: ${response.statusCode}`);
  return next();
}

function measureResponseTime(requestParams, response, context, ee, next) {
  const responseTime = response.timings?.phases?.total || 0;
  
  if (responseTime > 1000) {
    console.log(`Slow response detected: ${responseTime}ms for ${requestParams.url}`);
  }
  
  // Emitir métrica personalizada
  ee.emit('customStat', 'response_time', responseTime);
  
  return next();
}