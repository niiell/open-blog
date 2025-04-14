const Post = require('../models/post');


exports.index = async (req, res) => {
    if (req.isAuthenticated()) {
        let jmlPost = 0;
        let postAktif = 0;
        let postArsip = 0;

        try {
            const foundPosts = await Post.find().exec();
            jmlPost = foundPosts.length;
            foundPosts.forEach(post => {
                if (post.active === 1) {
                    postAktif++;
                } else {
                    postArsip++;
                }
            });
            res.render("dashboard", {title: "Dashboard", jmlPost, postAktif, postArsip});
        } catch (err) {
            console.log(err);
            res.status(500).send("Error loading posts");
        }
    } else {
        res.redirect('/auth/login');
    }
}
