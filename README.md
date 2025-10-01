# Todo

This project creates a simple todo list web application. Using Django as the web
server to service both front and back end elements as well as a convienent connection
to a database engine. To run this web app, follow the steps in the **Launch** section
of this document.

This project is of a simple Todo list application. Users are able to login with
their credentials and see their lists of tasks. They can add, edit, delete, or 
mark complete tasks within their groups. Similarly, they should be able to add,
edit, and delete groups. A REST API was provided to allow for the development of
a single page application and a potential mobile app project. Please see the 
**Design Considerations** section of this document for more information.

---

### Launch

Before starting the web server, you will need to ensure that you have all of the 
dependencies listed below:

* Python3
* Django
* Channels
* Redis
* channels_redis
* Docker (Used for Redis server)
* daphne

This project was written using a Linux operating system and as such, there may 
be problems running it on Windows or macOS (specifically when considering the file
line endings).

To launch the server, first launch the redis server using the following command:

`$ docker run --rm -p 6379:6379 redis:7`

Once the Redis server is running, ensure that your terminal is in _./Todo/Todo/_ and 
run the command:

`$ python3 manage.py runserver`

Note that in some terminals enviornments it is required to specify file names prefixed
with the local path (e.g., "*.\manage.py*"). If there are problems running the program 
ensure that the migrations are updated by running the commands:

`$ python3 manage.py makemigrations`

and

`$ python3 manage.py migrate`

---

### Design Considerations

While the app has front and back end features including webpages, the focus was on the 
backend. A REpresentation State Transfer (REST) API was created as a method of allowing
different front-ends to communicate with the same server allowing for the potential 
support of cross platform applications (e.g., mobile). This also provides the ability
for the web app to provide a single (or few) page application. This can provide benefits
in the execution speed as the server will be recieving requests and returning JSON
objects rather than full webpages with styling and scripts.

The REST API is summerized below:

<table>
  <tr>
    <th>URL</th>
    <th>Method</th>
    <th>Purpose</th>
  </tr>
  <tr>
    <td><code>/task/info/&lt;ID&gt;</code></td>
    <td>GET</td>
    <td>Returns the information pretaining to the specified task.</td>
  </tr>
  <tr>
    <td><code>/task/edit/&lt;ID&gt;</code></td>
    <td>PUT</td>
    <td>Updates the infomration of the specified task.</td>
  </tr>
  <tr>
    <td><code>/task/delete/&lt;ID&gt;</code></td>
    <td>GET</td>
    <td>Deletes the specified task.</td>
  </tr>
  <tr>
    <td><code>/task/new</code></td>
    <td>PUT</td>
    <td>Creates a new task.</td>
  </tr>
  <tr>
    <td><code>/group/info/&lt;ID&gt;</code></td>
    <td>GET</td>
    <td>Returns the information pretaining to the specified group.</td>
  </tr>
  <tr>
    <td><code>/group/edit/&lt;ID&gt;</code></td>
    <td>PUT</td>
    <td>Updates the information for the specified group.</td>
  </tr>
  <tr>
    <td><code>/group/delete/&lt;ID&gt;</code></td>
    <td>GET</td>
    <td>Deletes the specified group.</td>
  </tr>
  <tr>
    <td><code>/group/new</code></td>
    <td>PUT</td>
    <td>Creates a new group.</td>
  </tr>
  <tr>
    <td><code>/user/tasks</code></td>
    <td>PUT</td>
    <td>Returns a list of all of the task IDs of the user.</td>
  </tr>
  <tr>
    <td><code>/user/groups</code></td>
    <td>PUT</td>
    <td>Returns a list of all of the group IDs of the user.</td>
  </tr>
  <tr>
    <td><code>/project/&lt;ID&gt;/task/new</code></td>
    <td>PUT</td>
    <td>Creates a new task for the specified project ID.</td>
  </tr>
  <tr>
    <td><code>/project/&lt;ID&gt;/task/edit/&lt;task-ID&gt;</code></td>
    <td>PUT</td>
    <td>Updates task information for the specified project ID.</td>
  </tr>
  <tr>
    <td><code>/project/&lt;ID&gt;/task/delete/&lt;task-ID&gt;</code></td>
    <td>GET</td>
    <td>Deletes a task within the specified project ID.</td>
  </tr>
  <tr>
    <td><code>/project/&lt;ID&gt;/group/new</code></td>
    <td>PUT</td>
    <td>Creates a new group within the specified project ID.</td>
  </tr>
  <tr>
    <td><code>/project/&lt;ID&gt;/group/edit/&lt;group-ID&gt;</code></td>
    <td>PUT</td>
    <td>Updates group information for the specified project ID.</td>
  </tr>
  <tr>
    <td><code>/project/&lt;ID&gt;/group/delete/&lt;group-ID&gt;</code></td>
    <td>GET</td>
    <td>Deletes a group within the specified project ID.</td>
  </tr>
</table>

Additionally, the webserver makes use of websockets as a means to keep the UI consistent 
when the user is logged in on multiple computers as well as to facilitate the collaborative
features. The Websocket implementation was designed to incorperate the REST API. Some of the 
API's methods are not called in this project but left to allow for extending the application
at a later date. There are two consumers (websocket classes) that are used. The first is 
called __UserConsumer__ and it ensures that multiple sessions for the same user are up-to-date
and consistent. The second consumer is called __GroupConsumer__ and it manages the multi-user
groups that facilitate the collaborative features.

The __UserConsumer__ connects all sessions for the same user together and ensures that they 
are updated to be in sync with each other. When a user visits a page with volitile data (
information that can be updated at a moment's notice) then they connect to the websocket server
and are assigned to a group for their user only. If the user updates information the websocket
will send the update notice to all other user sessions under the same account to check for updates.

---

### Styling

The CSS code was written for this project and takes inspiration from Bootstrap. The CSS 
styling includes styling for HTML elements, as well as compound elements and page layout.
Compound elements are those that are comprised of HTML elements (e.g., button groups). Any
additional scripting needed for them will be implemented in JavaScript files located in the
_/static/basic_light/compound/_ folder.