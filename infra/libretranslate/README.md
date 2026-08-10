# Local open-source translation provider

BhashaYantra can connect directly to a locally hosted LibreTranslate API. The
provider is open source, remains on the user's computer, and does not require a
paid API key.

## Start on Windows

Docker Desktop must be running. From the project root:

```powershell
docker compose -f infra/libretranslate/compose.yml up -d
```

The first start downloads the selected Argos Translate language packages and
can take several minutes. Check the service:

```powershell
Invoke-RestMethod http://127.0.0.1:5000/languages
```

In BhashaYantra, open **Convert Document → Translation**, select
**LibreTranslate**, keep `http://127.0.0.1:5000`, and choose **Check provider**.

The starter stack loads the currently published English, Hindi, and Bengali
Argos packages. Marathi, Punjabi, and Gujarati remain available through the
Google/Supabase provider until validated open-source model packages are added.

Stop the service without deleting its image:

```powershell
docker compose -f infra/libretranslate/compose.yml down
```

Machine translation is probabilistic. BhashaYantra validates the response,
rejects unchanged output, and checks the selected target script, but human
review is still required for legal, examination, medical, or publication use.
