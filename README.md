# AngularAppBuilder
<h5>Quickly stems out an angular app with routing, module, and service file creation applying a variant of John Papa's style guide.</h5>

The resulting product incorporates routing, is plumbed for locale settings, includes bootstrap 3, and includes what I believe to be Anular's missing notification service which acts as a replacement for $emit, $brodcast, $on, allowing all levels of your application to communicate with eachother and tap into past notification data.

For more information on the notification service, view the included commonService file. The basic notification methods are:

  <code>commonService.listen()</code>

  <code>commonService.listenMemory()</code>

  <code>commonService.getMemory()</code>

  <code>commonService.notify()</code>
<hr>
To run the Application Builder, execute the following in your terminal

<code>npm install</code>

<code>node app</code>
<hr>
and then navigate to http://localhost:3521/

Add views, add modules to your views, and add services to your modules.

Clicking the "build" button will stem out your angular application with a basic node server (follow further instructions in your console once your app is built).
