from models.permission import Permission

# Permessi di default
DEFAULT_PERMISSIONS = {
    'base': {
        'title': False,
        'description': False,
        'status': False,
        'priority': False,
        'due_date': False,
        'assigned_to': False,
    },
    'reviewer': {
        'title': True,
        'description': True,
        'status': True,
        'priority': True,
        'due_date': True,
        'assigned_to': True,
    },
    'admin': {
        'title': True,
        'description': True,
        'status': True,
        'priority': True,
        'due_date': True,
        'assigned_to': True,
    }
}

def init_permissions():
    """Inizializza i permessi di default se non esistono"""
    for role, fields in DEFAULT_PERMISSIONS.items():
        for field, can_edit in fields.items():
            Permission.get_or_create(
                role=role,
                field=field,
                defaults={'can_edit': can_edit}
            )

def get_permissions(role):
    """Ottiene i permessi per un ruolo"""
    perms = {}
    for perm in Permission.select().where(Permission.role == role):
        perms[perm.field] = perm.can_edit
    return perms

def can_edit_field(role, field):
    """Verifica se un ruolo può modificare un campo"""
    try:
        perm = Permission.get((Permission.role == role) & (Permission.field == field))
        return perm.can_edit
    except Permission.DoesNotExist:
        return DEFAULT_PERMISSIONS.get(role, {}).get(field, False)

def toggle_permission(role, field):
    """Toggle permesso per un ruolo e campo"""
    try:
        perm = Permission.get((Permission.role == role) & (Permission.field == field))
        perm.can_edit = not perm.can_edit
        perm.save()
        return perm.can_edit
    except Permission.DoesNotExist:
        perm = Permission.create(role=role, field=field, can_edit=True)
        return perm.can_edit
