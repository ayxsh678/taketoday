import sys
import os

# Add the prisma_client directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'prisma_client'))

try:
    from index import Prisma
    print("SUCCESS: Prisma imported from index")
    db = Prisma()
    print("SUCCESS: Prisma instance created")
except Exception as e:
    print(f"ERROR: {e}")
    # Try alternative import
    try:
        from prisma_client.index import Prisma
        print("SUCCESS: Prisma imported from prisma_client.index")
        db = Prisma()
        print("SUCCESS: Prisma instance created")
    except Exception as e2:
        print(f"ERROR: {e2}")