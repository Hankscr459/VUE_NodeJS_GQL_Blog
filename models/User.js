import  mongoose from 'mongoose'
import md5 from 'md5'
import bcrypt from 'bcrypt'

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  favorites: {
    type: [mongoose.Schema.Types.ObjectId],
    required: true,
    ref: "Post"
  }
});


// Create and add avatar to user
UserSchema.pre('save', function(next) {
  this.avatar = `http://gravatar.com/avatar/${md5(this.username)}?d=identicon`
  next()
})

// Hash password so it can't be seen w/ access to database
UserSchema.pre('save', function(next) {
  if (!this.isModified('password')) {
    return next()
  }

  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err)

    bcrypt.hash(this.password, salt, (err, hash) => {
      if (err) return next(err)
  
      this.password = hash
      next()
    })
  })
}) 


const User = mongoose.model("User", UserSchema);

export default User
