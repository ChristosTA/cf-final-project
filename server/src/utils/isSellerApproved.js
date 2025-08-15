function isSellerApproved(user) {
    return user?.sellerStatus === 'APPROVED'
        || user?.sellerProfile?.approved === true
        || user?.sellerProfile?.verification?.status === 'APPROVED';
}
module.exports = { isSellerApproved };
