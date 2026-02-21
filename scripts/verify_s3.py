import boto3, os
from dotenv import load_dotenv
load_dotenv()

s3 = boto3.client("s3",
    region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

for bucket in ["llmop-ml-data-dev", "llmop-ml-models-dev", "llmop-ml-metrics-dev"]:
    print(f"\n📦 {bucket}:")
    try:
        objs = s3.list_objects_v2(Bucket=bucket, MaxKeys=20)
        for o in objs.get("Contents", []):
            print(f"  {o['Key']} ({o['Size']:,} bytes)")
        if not objs.get("Contents"):
            print("  (empty)")
    except Exception as e:
        print(f"  ERROR: {e}")
