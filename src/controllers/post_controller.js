const Post = require('../models/post');
const Comment = require('../models/comment');
const multer = require('multer'); // Upload image
const {arrDay, arrMonth} = require('../helpers/dates');
const showAlert = require('../helpers/alert.js');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      try {
        const uploadPath = path.join(__dirname, '../../public/img/post');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
        // Now matches the static file serving path in app.js
      } catch (err) {
        cb(new Error('Failed to create upload directory'));
      }
    },
    filename: function (req, file, cb) {
      try {
        // Sanitize filename and add timestamp
        const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        cb(null, filename);
      } catch (err) {
        cb(new Error('Failed to process filename'));
      }
    }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});


exports.show = (req, res) => {
    const postSlug = req.params.postSlug;
    let post = null;
    let posts = null;

    Post.findOne({slug: postSlug}).exec()

    .then((foundPost) => {
        post = foundPost;
        return Post.find({active: 1}).limit(5).sort({created_at: -1}).exec();
    })

    .then((foundPosts) => {
        posts = foundPosts;
        return Comment.find({postSlug: postSlug}).sort({created_at: -1}).exec();
    })

    .then(foundComments => {
        console.log('Displaying post with image:', post.img);
        console.log('Full image path:', `/img/post/${post.img}`);
        res.render("post-page", {title: post.title, tag: "", otherPosts: posts, currentPost: post, comments: foundComments, arrDay, arrMonth, search: "", isAuthLink: req.isAuthenticated()});
    })

    .catch(err => {
        console.log(err);
    });
}

exports.showTag = async (req, res) => {
  try {
    const postTag = req.params.postTag;
    const foundPosts = await Post.find({tags: postTag}).exec();
    const foundForTags = await Post.find({active: 1}).sort({created_at: -1}).exec();

    // Push tag di setiap post ke array,
    // Lalu hilangkan duplikat
    let allTags = [];
    foundForTags.forEach(post => {
      post.tags.forEach(tag => {
        allTags.push(tag);
      });
    });
    
    allTags = allTags.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });

    res.render("frontend", {
      title: postTag,
      tag: postTag,
      posts: foundPosts,
      arrDay,
      arrMonth,
      search: "",
      isAuthLink: req.isAuthenticated(),
      tags: allTags
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
}

exports.create = (req, res) => {
  if (req.isAuthenticated()) {
      res.render("tambah-post-baru", {title: "Tambah Post Baru", alert: "", previousLink: "/admin/tampil-semua-post", previousTitle: "Tampil Semua Post"});
  } else {
      res.redirect('/auth/login');
  }
}

exports.store = async (req, res) => {
  const title = req.body.title;
  const slug = title.replace(/\s+/g, '-').toLowerCase();
  const content = req.body.content;
  const tags = req.body.tags.split(",");
    // Get processed filename directly from multer to ensure consistency
    const img = req.file ? req.file.filename : ""; 

  try {
    const foundPost = await Post.findOne({title}).exec();
    
    if (foundPost) {
      return res.render("tambah-post-baru", {
        title: "Tambah Post Baru", 
        alert: showAlert("alert-danger", "judul post sudah ada!"), 
        previousLink: "/admin/tampil-semua-post", 
        previousTitle: "Tampil Semua Post"
      });
    }

    if (!title || !content || !tags) {
      return res.render("tambah-post-baru", {
        title: "Tambah Post Baru", 
        alert: showAlert("alert-warning", "data tidak boleh kosong!"), 
        previousLink: "/admin/tampil-semua-post", 
        previousTitle: "Tampil Semua Post"
      });
    }

    const newPost = new Post({
        title,
        slug,
        content,
        img: img, // Ensure the image filename is saved correctly
        tags,
        author: "Admin",
        active: 1,
        created_at: new Date().getTime(),
        updated_at: new Date().getTime()
    });

    await newPost.save();
    
    res.render("tambah-post-baru", {
      title: "Tambah Post Baru", 
      alert: showAlert("alert-success", "post baru berhasil ditambahkan."), 
      previousLink: "/admin/tampil-semua-post", 
      previousTitle: "Tampil Semua Post"
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving post");
  }
}

exports.indexAdmin = async (req, res) => {
  if (req.isAuthenticated()) {
      try {
          const foundPosts = await Post.find({active: 1}).exec();
          res.render("tampil-semua-post", {
              title: "Tampil Semua Post", 
              tag: "", 
              posts: foundPosts, 
              arrDay, 
              arrMonth, 
              search: "", 
              alert: "", 
              previousLink: "/admin/dashboard", 
              previousTitle: "Dashboard"
          });
      } catch (err) {
          console.log(err);
          res.status(500).send("Error loading posts");
      }
  } else {
      res.redirect('/auth/login');
  } 
}

exports.findAdmin = async (req, res) => {
  const search = req.body.search;
  
  if (search === "") {
      return res.redirect("/admin/tampil-semua-post");
  }

  try {
      const foundPosts = await Post.find({
          title: {$regex: ".*"+search+".*", $options: 'i'}, 
          active: 1
      }).exec();
      
      res.render("tampil-semua-post", {
          title: "Search: " + search, 
          tag: "", 
          posts: foundPosts, 
          arrDay, 
          arrMonth, 
          search, 
          alert: "", 
          previousLink: "/admin/tampil-semua-post", 
          previousTitle: "Tampil Semua Post"
      });
  } catch (err) {
      console.log(err);
      res.status(500).send("Error searching posts");
  }
}

exports.showAdmin = (req, res, next) => {
  if (req.isAuthenticated()) {
      const postSlug = req.params.postSlug;
      let post = null;

      Post.findOne({slug: postSlug}).exec()

      .then((foundPost) => {
          post = foundPost;
          return Comment.find({postSlug: postSlug}).sort({created_at: -1}).exec();
      })

      .then(foundComments => {
          res.render("admin-post-page", {title: post.title, tag: "", currentPost: post, comments: foundComments, arrDay, arrMonth, search: "", isAuthLink: req.isAuthenticated(), previousLink: "/admin/tampil-semua-post", previousTitle: "Tampil Semua Post"});
      })

      .then(null, next);
  } else {
      res.redirect('/auth/login');
  }
}

exports.showTagAdmin = async (req, res) => {
  if (req.isAuthenticated()) {
      try {
          const postTag = req.params.postTag;
          const foundPosts = await Post.find({tags: postTag}).exec();
          res.render("tampil-semua-post", {
              title: postTag, 
              tag: postTag, 
              posts: foundPosts, 
              arrDay, 
              arrMonth, 
              search: "", 
              alert: "", 
              previousLink: "/admin/tampil-semua-post", 
              previousTitle: "Tampil Semua Post"
          });
      } catch (err) {
          console.log(err);
          res.status(500).send("Error loading tagged posts");
      }
  } else {
      res.redirect('/auth/login');
  }
}

exports.archievingPostAdmin = async (req, res) => {
  const postSlug = req.params.postSlug;
  console.log(`Attempting to archive post: ${postSlug}`);

  try {
      // Log post state before update
      const preUpdatePost = await Post.findOne({slug: postSlug}).exec();
      console.log('Pre-update post state:', preUpdatePost ? preUpdatePost.active : 'Not found');

      const result = await Post.findOneAndUpdate(
          {slug: postSlug}, 
          {active: 0},
          {new: true}
      ).exec();
      
      if (!result) {
          console.log(`Post not found: ${postSlug}`);
          return res.status(404).send("Post not found");
      }

      // Log post state after update
      console.log('Post update result:', result);
      console.log('Post active status after update:', result.active);

      // Verify the update in database
      const post = await Post.findOne({slug: postSlug}).exec();
      console.log('Database verification - post active status:', post.active);

      console.log(`Successfully archived post: ${postSlug}`);
      res.redirect("/admin/tampil-semua-post");
  } catch (err) {
      console.error('Error archiving post:', err);
      res.status(500).send("Error archiving post");
  }
}

exports.destroy = async (req, res) => {
  const postSlug = req.params.postSlug;
  console.log(`Attempting to delete post: ${postSlug}`);

  try {
      const foundPost = await Post.findOne({slug: postSlug}).exec();
      if (!foundPost) {
          console.log(`Post not found: ${postSlug}`);
          return res.redirect("/admin/arsip-post");
      }
      
      console.log('Found post to delete:', foundPost);
      const result = await Post.findOneAndDelete({_id: foundPost._id}).exec();
      
      if (!result) {
          console.log('Delete operation failed for post:', postSlug);
          return res.status(500).send("Failed to delete post");
      }

      console.log('Successfully deleted post:', postSlug);
      res.redirect("/admin/arsip-post");
  } catch (err) {
      console.error('Error deleting post:', err);
      res.status(500).send("Error deleting post");
  }
}

exports.indexArchieveAdmin = async (req, res) => {
  if (req.isAuthenticated()) {
      try {
          const foundPosts = await Post.find({active: 0}).exec();
          res.render("arsip-post", {
              title: "Arsip Post", 
              posts: foundPosts, 
              arrDay, 
              arrMonth, 
              tag: "", 
              search: "", 
              alert: "", 
              previousLink: "/admin/dashboard", 
              previousTitle: "Dashboard"
          });
      } catch (err) {
          console.log(err);
          res.status(500).send("Error loading archived posts");
      }
  } else {
      res.redirect('/auth/login');
  }
}

exports.findArchieveAdmin = async (req, res) => {
  const search = req.body.search;
  
  if (search === "") {
      return res.redirect("/admin/arsip-post");
  }

  try {
      const foundPosts = await Post.find({
          title: {$regex: ".*"+search+".*", $options: 'i'},
          active: 0
      }).exec();
      
      res.render("arsip-post", {
          title: "Search: " + search, 
          tag: "", 
          posts: foundPosts, 
          arrDay, 
          arrMonth, 
          search, 
          alert: "", 
          previousLink: "/admin/arsip-post", 
          previousTitle: "Arsip Post"
      });
  } catch (err) {
      console.log(err);
      res.status(500).send("Error searching archived posts");
  }
}

exports.activatePost = async (req, res) => {
  const postSlug = req.params.postSlug;

  try {
      await Post.findOneAndUpdate({slug: postSlug}, {active: 1}).exec();
      res.redirect("/admin/arsip-post");
  } catch (err) {
      console.log(err);
      res.status(500).send("Error activating post");
  }
}

exports.modify = async (req, res) => {
  if (req.isAuthenticated()) {
      const postSlug = req.params.postSlug;

      try {
          const foundPost = await Post.findOne({slug: postSlug}).exec();
          res.render("ubah-post", {
              title: "Ubah Post", 
              post: foundPost, 
              alert: "", 
              previousLink: "/admin/tampil-semua-post", 
              previousTitle: "Tampil Semua Post"
          });
      } catch (err) {
          console.log(err);
          res.status(500).send("Error loading post for modification");
      }
  } else {
      res.redirect('/auth/login');
  }
}

exports.update = async (req, res) => {
  const title = req.body.title;
  const slug = req.body.slug;
  const content = req.body.content;
  const tags = req.body.tags.split(",");
  const img = req.file ? req.file.filename : req.body.prev_img;
  const updated_at = new Date().getTime();

  try {
      await Post.findOneAndUpdate(
          {slug}, 
          {title, content, tags, img, updated_at}
      ).exec();
      res.redirect("/admin/tampil-semua-post");
  } catch (err) {
      console.log(err);
      res.status(500).send("Error updating post");
  }
}
