import os
from locust import HttpUser, task, constant

CODE = os.getenv("CODE", "q0X")

class Redirector(HttpUser):
    wait_time = constant(0)

    @task
    def redirect(self):
        self.client.get(f"/{CODE}", allow_redirects=False, name="/[code]")