from enum import Enum


class Etat(str, Enum):
    A_FAIRE = "A faire"
    EN_COURS = "En cours"
    TERMINEE = "Terminee"


def enum_values(enum_cls: type[Enum]) -> list[str]:
    return [member.value for member in enum_cls]