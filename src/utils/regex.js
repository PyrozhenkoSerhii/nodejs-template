exports.email = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/
exports.password = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
exports.url = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/
exports.phone = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im

exports.idCharacters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@'