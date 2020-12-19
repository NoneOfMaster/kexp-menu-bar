exports.wait = duration =>
  new Promise(resolve => setTimeout(() => resolve(), duration));
