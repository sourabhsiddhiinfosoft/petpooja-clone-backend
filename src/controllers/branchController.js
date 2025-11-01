
import Branch from "../models/Branch.js";
import Restaurant from "../models/Restaurant.js";

export const createBranch = async (req, res, next) => {
  try {
    const {restaurantId} = req.params ||  req.body;
    console.log('Creating branch for restaurantId:', restaurantId);
    // ensureRestaurantOwner middleware should have validated ownership
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const branch = await Branch.create({
      restaurantId: restaurant?._id,
      name: req.body.name,
      address: req.body.address || {},
      manager: req.body.manager || {},
      tables: req.body.tables || 0,
      status: req.body.status || 'active'
    });

    // push branch reference to restaurant.branches
    restaurant.branches = restaurant.branches || [];
    restaurant.branches.push(branch._id);
    await restaurant.save();

    return res.status(201).json({ branch });
  } catch (err) { next(err); }
};

export const listBranchesForRestaurant = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId;
    const branches = await Branch.find({ restaurantId });
    return res.json(branches);
  } catch (err) { next(err); }
};

export const getBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Not found' });
    // ensureBranchOwner middleware should have validated ownership if needed
    return res.json({ branch });
  } catch (err) { next(err); }
};

export const updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Not found' });

    const updatable = ['name','address','manager','tables','status'];
    updatable.forEach(k => { if (req.body[k] !== undefined) branch[k] = req.body[k]; });
    await branch.save();
    return res.json({ branch });
  } catch (err) { next(err); }
};

export const deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Not found' });

    // remove branch from restaurant.branches
    await Restaurant.findByIdAndUpdate(branch.restaurantId, { $pull: { branches: branch._id } });

    await branch.remove();
    return res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};