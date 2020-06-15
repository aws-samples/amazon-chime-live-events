if [ -z "$CFOAI_S3" ]
then
  echo "No origin access ID."
  exit 1 
fi

if [ -z "$ASSET_S3_BUCKET" ]
then
  echo "No destination bucket."
  exit 1 
fi

echo "Deploying contents of $PWD/dist to $ASSET_S3_BUCKET."
aws s3 cp --grants read=id="$CFOAI_S3" --exclude "*.html" --exclude "*.js" --exclude "*.svg" --exclude "*.ttf" --recursive dist/ "s3://$ASSET_S3_BUCKET/"

aws s3 cp --grants read=id="$CFOAI_S3" --exclude "*" --include "*.html" --content-type "text/html" --recursive dist/ "s3://$ASSET_S3_BUCKET/"
aws s3 cp --grants read=id="$CFOAI_S3" --exclude "*" --include "*.js" --content-type "application/javascript" --recursive dist/ "s3://$ASSET_S3_BUCKET/"
aws s3 cp --grants read=id="$CFOAI_S3" --exclude "*" --include "*.svg" --content-type "image/svg+xml" --recursive dist/ "s3://$ASSET_S3_BUCKET/"
aws s3 cp --grants read=id="$CFOAI_S3" --exclude "*" --include "*.ttf" --content-type "application/x-font-ttf" --recursive dist/ "s3://$ASSET_S3_BUCKET/"
