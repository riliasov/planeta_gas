/**
 * Сервис для интеграций (WhatsApp, etc.)
 */
const IntegrationService = {
  
  generateWhatsAppText: function(formData) {
    return `Здравствуйте, ${formData.client}! Ждем вас ${formData.date} в ${formData.time}, тренер ${formData.trainer}.`;
  }

};
