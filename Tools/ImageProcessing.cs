using System;
using System.Drawing;

using System.IO;

namespace Tools
{
	///Like an iditoi I ported this to .net core before I discovered that drawing is not supported there.!--
	//Sucks to be me.
	public class ImageProcessing
	{
		public static int max_size = 200;


	public static void ProcessFolder(string folder){
			if(!Directory.Exists(folder)){
				return;
			}
			var files = Directory.GetFiles (folder,"*.png");
			for (int i = 0; i < files.Length; i++) {
				ImageProcessing.ProcessImage (files[i]);
			}
	
	}
	
		/// <summary>
		/// Processes a pngimage so it is square and max_sized resaves as teh smae file name if differnt size or too big.
		/// </summary>
		/// <param name="filepath">Filepath.</param>
		public static void ProcessImage(string filepath){
	/*		Image img = Image.FromFile (filepath,true);
			Image newImg;
			if (img.Width != img.Height || img.Width > max_size) {
				Console.WriteLine ("redoing:" + filepath);
				newImg = new Bitmap (max_size, max_size);

				int x = 0;
				int y = 0;
			
				if (img.Width != img.Height) {
					
					if (img.Width > img.Height) {
						y = (int)Math.Round((double)(max_size - ((double)max_size / img.Width * img.Height)) / 2);
					}
					else{
						x = (int)Math.Round((double)(max_size - ((double)max_size / img.Height * img.Width)) / 2);
					}
				}

				using (Graphics gfx = Graphics.FromImage (newImg)) {
					gfx.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
					gfx.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;
					gfx.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
					gfx.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
					gfx.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;

					gfx.DrawImage (img, new Rectangle(x, y, max_size-(2*x), max_size-(2*y)), 0, 0, img.Width, img.Height, GraphicsUnit.Pixel);

				}


				newImg.Save (filepath, ImageFormat.Png);
			}*/



		}
	}


}

