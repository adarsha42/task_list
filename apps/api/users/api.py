from django.contrib.auth import get_user_model, login, logout
from ninja import Router
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie

from .schemas import LogIn, UserOut

router = Router(tags=["auth"])


@router.get("/csrf", auth=None)
@ensure_csrf_cookie
@csrf_exempt
def csrf_token(request):
    return HttpResponse(status=204)


User = get_user_model()


@router.post("/login", response=UserOut)
def login_user(request, payload: LogIn):
    identifier = payload.identifier.strip()

    # try username
    user = User.objects.filter(username__iexact=identifier).first()

    # try email
    if user is None:
        user = User.objects.filter(email__iexact=identifier).first()

    # create users if doesn't exist
    if user is None:
        if "@" in identifier:
            user = User(
                username=identifier,
                email=identifier,
            )
        else:
            user = User(
                username=identifier,
            )

        # has no usable password.
        user.set_unusable_password()
        user.save()

    # Creates the Django session
    login(request, user)

    return user


@router.post("/logout")
def logout_user(request):
    logout(request)

    return {"success": True}


@router.get("/me", response=UserOut)
def current_user(request):
    if not request.user.is_authenticated:
        return 401, {"detail": "Not authenticated"}

    return request.user
