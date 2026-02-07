const DeletedAccount = require("../models/DeletedAccount");

const DeletedAccountRepository = {
  async create(deletedData) {
    return await DeletedAccount.create(deletedData);
  },
};

module.exports = DeletedAccountRepository;
