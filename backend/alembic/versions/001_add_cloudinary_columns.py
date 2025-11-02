"""add cloudinary columns

Revision ID: 001
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('users', sa.Column('profile_picture_url', sa.String(500), nullable=True))
    op.add_column('users', sa.Column('profile_picture_public_id', sa.String(200), nullable=True))
    op.add_column('users', sa.Column('banner_image_url', sa.String(500), nullable=True))
    op.add_column('users', sa.Column('banner_image_public_id', sa.String(200), nullable=True))

def downgrade():
    op.drop_column('users', 'banner_image_public_id')
    op.drop_column('users', 'banner_image_url')
    op.drop_column('users', 'profile_picture_public_id')
    op.drop_column('users', 'profile_picture_url')
