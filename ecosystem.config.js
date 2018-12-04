module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    // First application
    {
      name      : "bot",
      script    : "lib/bot.js",
      watch	: true,
      ignore_watch: ["node_modules", "mem"],
      args: "$NICK $PWD"
    }
    //,
    // Second application
    //{
    //  name      : "WEB",
    //  script    : "web.js"
    //}
  ]
}
