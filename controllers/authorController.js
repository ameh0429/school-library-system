import Author from "../models/Author.js";

// GET /authors
export const getAuthors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const filter = search ? { name: { $regex: search, $options: "i" } } : {};

    const [authors, total] = await Promise.all([
      Author.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Author.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: authors,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /authors/:id
export const getAuthor = async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) {
      return res
        .status(404)
        .json({ success: false, message: "Author not found" });
    }
    res.json({ success: true, data: author });
  } catch (error) {
    next(error);
  }
};

// POST /authors
export const createAuthor = async (req, res, next) => {
  try {
    const author = await Author.create(req.body);
    res.status(201).json({ success: true, data: author });
  } catch (error) {
    next(error);
  }
};

// PUT /authors/:id
export const updateAuthor = async (req, res, next) => {
  try {
    const author = await Author.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!author) {
      return res
        .status(404)
        .json({ success: false, message: "Author not found" });
    }
    res.json({ success: true, data: author });
  } catch (error) {
    next(error);
  }
};

// DELETE /authors/:id
export const deleteAuthor = async (req, res, next) => {
  try {
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) {
      return res
        .status(404)
        .json({ success: false, message: "Author not found" });
    }
    res.json({ success: true, message: "Author deleted successfully" });
  } catch (error) {
    next(error);
  }
};