import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import ejs from "ejs";



const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración del motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', './views');


const readData = () => {
  try {
    const data = fs.readFileSync("./db.json");
    return JSON.parse(data);
  } catch (error) {
    console.log(error);
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync("./db.json", JSON.stringify(data));
  } catch (error) {
    console.log(error);
  }
};

app.get('/', (req, res) => {
  const data = readData();
  const sortedPosts = data.posts.sort((a, b) => new Date(b.created) - new Date(a.created));
  const postsWithUserDataAndComments = sortedPosts.map(post => {
    const user = data.users.find(user => user.id === post.userId);
    const comments = data.comments.filter(comment => comment.postId === post.id)
      .map(comment => ({ ...comment, user: data.users.find(user => user.id === comment.userId) }));
    return { ...post, user, comments };
  });
  res.render('index', { posts: postsWithUserDataAndComments });
});


app.post('/populate', (req, res) => {
  // Crear 10 usuarios de prueba
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = {
      id: i,
      username: `User${i}`,
      avatar: `https://www.example.com/avatar${i}.jpg`,
      created: new Date().toISOString(),
    };
    users.push(user);
  }

  // Crear 5 posts para cada usuario
  const posts = [];
  let postId = 1;
  for (const user of users) {
    for (let i = 1; i <= 5; i++) {
      const post = {
        id: postId,
        title: `Post ${postId}`,
        content: `This is post ${postId}`,
        image: `https://www.example.com/image${postId}.jpg`,
        userId: user.id,
        created: new Date().toISOString(),
      };
      posts.push(post);
      postId++;
    }
  }

  // Crear 5 comentarios para cada post
  const comments = [];
  let commentId = 1;
  for (const post of posts) {
    for (let i = 1; i <= 5; i++) {
      const comment = {
        id: commentId,
        content: `Comment ${commentId} on ${post.title}`,
        userId: users[Math.floor(Math.random() * users.length)].id,
        postId: post.id,
        created: new Date().toISOString(),
      };
      comments.push(comment);
      commentId++;
    }
  }

  // Escribir los datos en los archivos JSON
  const data = { users, posts, comments };
  writeData(data);
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // Redirigir a la vista de usuarios en la web
   res.redirect('/');
  } else {
    // Devolver la lista de usuarios en formato JSON
  res.json({ message: 'Base de datos poblada con éxito' });
  }
});

app.post('/reset', (req, res) => {
  // Eliminar todos los posts, comentarios y usuarios
  const data = { users: [], posts: [], comments: [] };
  writeData(data);
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // Redirigir a la vista de usuarios en la web
   res.redirect('/');
  } else {
    // Devolver la lista de usuarios en formato JSON
  res.json({ message: 'Estado de la API reiniciado con éxito' });
  }
});



// Ruta para mostrar la lista de usuarios en HTML
app.get("/users", (req, res) => {
  const data = readData();

  // Verificar si la solicitud proviene de un navegador
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // Redirigir a la vista de usuarios en la web
  res.render('users', { users: data.users });
  } else {
    // Devolver la lista de usuarios en formato JSON
    res.json(data.users);
  }
});

// Ruta para agregar un nuevo usuario
app.post("/users", (req, res) => {
  const data = readData();
  const body = req.body;
  if (!body.username || !body.password || !body.avatar) {
    res.status(400).json({ error_message: 'Parametros insuficientes' });
    return;
  }
  const newUser = {
    id: data.users.length + 1,
    username: body.username,
    password: body.password,
    avatar: body.avatar,
    created: new Date().toISOString(),	
  };
  data.users.push(newUser);
  writeData(data);
  res.redirect('/users');
});


app.get("/users/:id", (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  const user = data.users.find((user) => user.id === id);
  if (!user) {
    return res.status(404).send('Usuario no encontrado');
  }
  const userPosts = data.posts.filter(post => post.userId === id);
  const userComments = data.comments.filter(comment => comment.userId === id);

  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // Redirigir a la vista de usuarios en la web
   res.render('user', { user, userPosts, userComments });
  } else {
    // Devolver la lista de usuarios en formato JSON
    res.json(user);
  }
});

app.get("/posts", (req, res) => {
  const data = readData();
    // Verificar si la solicitud proviene de un navegador
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // Redirigir a la vista de usuarios en la web
  res.render('posts', { data: data });
  } else {
    // Devolver la lista de usuarios en formato JSON
    res.json(data.posts);
  }
});

app.get("/posts/:id", (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  const post = data.posts.find((post) => post.id === id);
    // Verificar si se encontró el post
  if (!post) {
    return res.status(404).json({ error_message: 'Post no encontrado' });
  }
  else
    {
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // Redirigir a la vista de usuarios en la web
      res.render('post', { post: post , data: data});
    } else {
      // Devolver la lista de usuarios en formato JSON
      res.json(post);
    }
  }
});

app.post("/posts", (req, res) => {
  const data = readData();
  const body = req.body;

  if (!body.title || !body.content || !body.image || !body.userId) {
    res.status(400).json({ error_message: 'Parametros insuficientes' });
    return;
  }
  const id = parseInt(body.userId);
  const user = data.users.find((user) => user.id === id);
  if (!user) {
    return res.status(404).send('Usuario no encontrado');
  }


  const newPost = {
    id: data.posts.length + 1,
    title: body.title,
    content: body.content,
    image: body.image,
    userId: body.userId,
    created: new Date().toISOString(),  
  };
  data.posts.push(newPost);
  writeData(data);
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // Redirigir a la vista de usuarios en la web
  res.render('posts', { posts: newPost });
  } else {
    // Devolver la lista de usuarios en formato JSON
    res.json(newPost);
  }

});

app.get("/comments", (req, res) => {
  const data = readData();
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // Redirigir a la vista de usuarios en la web
    res.render('comments', { comments: data.comments });
  } else {
    // Devolver la lista de usuarios en formato JSON
    res.json(data.comments);
  }
});

app.get("/comments/:id", (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  const comment = data.comments.find((comment) => comment.id === id);
  if (!comment) {
    return res.status(404).json({ error_message: 'Comentario no encontrado' });
  }
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // Redirigir a la vista de usuarios en la web
  res.render('comments', { comments: comments });
  } else {
    // Devolver la lista de usuarios en formato JSON
    res.json(comments);
  }
});

app.post("/comments", (req, res) => {
  const data = readData();
  const body = req.body;
  if (!body.content || !body.userId || !body.postId) {
    res.status(400).json({ error_message: 'Parametros insuficientes' });
    return;
  }
  const user_id = parseInt(body.userId);
  const post_id = parseInt(body.postId);  
  const user = data.users.find((user) => user.id === user_id);
  const post = data.posts.find((post) => post.id === post_id);
  if (!user || !post) {
    return res.status(404).json({ error_message: 'Parametros incorrectos' });
  }
  const newComment = {
    id: data.comments.length + 1,
    content: body.content,
    userId: body.userId,
    postId: body.postId,
    created: new Date().toISOString(), 
  };
  data.comments.push(newComment);
  writeData(data);
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // Redirigir a la vista de usuarios en la web
  res.render('comments', { comments: newComment });
  } else {
    // Devolver la lista de usuarios en formato JSON
    res.json(newComment);
  }
});



app.listen(3000, () => {
  console.log("Server listening on port 3000");
});