from ninja import Schema


class LogIn(Schema):
    identifier: str


class UserOut(Schema):
    id: int
    username: str
    email: str
